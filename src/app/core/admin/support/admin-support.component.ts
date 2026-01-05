import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Send,
  MessageSquare,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from 'lucide-angular';
import {
  SupportService,
  SupportTicket,
  SupportComment,
  SupportStatus,
} from 'src/app/features/support/support.service';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="bg-white border-b border-slate-200 px-8 py-6">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-2xl font-bold text-slate-900 mb-2">
            Support Tickets
          </h1>
          <p class="text-slate-600">
            Manage customer support requests and respond to inquiries
          </p>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="max-w-7xl mx-auto px-8 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <!-- Total -->
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

          <!-- Open -->
          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Open</span>
              <div
                class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="AlertCircleIcon"
                  [size]="16"
                  class="text-blue-600"
                />
              </div>
            </div>
            <p class="text-2xl font-bold text-blue-600">{{ stats().open }}</p>
          </div>

          <!-- In Progress -->
          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">
                In Progress
              </span>
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

          <!-- Resolved -->
          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Resolved</span>
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
              {{ stats().resolved }}
            </p>
          </div>

          <!-- Closed -->
          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Closed</span>
              <div
                class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="XCircleIcon"
                  [size]="16"
                  class="text-slate-600"
                />
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900">
              {{ stats().closed }}
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="md:col-span-2">
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (input)="applyFilters()"
                  placeholder="Search by name, email, or subject..."
                  class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <!-- Status Filter -->
            <div>
              <select
                [(ngModel)]="filterStatus"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tickets List -->
        <div
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          @if (isLoading()) {
          <div class="p-12 text-center">
            <div
              class="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-slate-600">Loading tickets...</p>
          </div>
          } @else if (filteredTickets().length === 0) {
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
            <p class="text-slate-600 font-medium mb-1">No tickets found</p>
            <p class="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
          } @else {
          <div class="divide-y divide-slate-200">
            @for (ticket of filteredTickets(); track ticket.id) {
            <div
              class="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
              (click)="selectTicket(ticket)"
            >
              <div class="flex items-start justify-between gap-4">
                <!-- Status Badge & Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span [class]="getStatusBadgeClass(ticket.status)">
                          {{ formatStatus(ticket.status) }}
                        </span>
                        <span
                          class="px-2.5 py-1 rounded-full text-xs font-semibold"
                          [class]="getCategoryBadgeClass(ticket.category)"
                        >
                          {{ ticket.category }}
                        </span>
                      </div>
                      <h3 class="font-semibold text-slate-900">
                        {{ ticket.subject }}
                      </h3>
                      <p class="text-sm text-slate-600 mt-1 line-clamp-1">
                        {{ ticket.message }}
                      </p>
                    </div>
                  </div>

                  <!-- Meta Info -->
                  <div class="flex items-center gap-4 text-xs text-slate-500">
                    <div>{{ ticket.name }}</div>
                    <span>•</span>
                    <div>{{ ticket.email }}</div>
                    <span>•</span>
                    <span>{{ formatDate(ticket.createdAt) }}</span>
                    @if (ticket.commentCount && ticket.commentCount > 0) {
                    <span>•</span>
                    <div class="flex items-center gap-1">
                      <lucide-icon [img]="MessageSquareIcon" [size]="14" />
                      <span>{{ ticket.commentCount }}</span>
                    </div>
                    }
                  </div>
                </div>

                <!-- Action Button -->
                <button
                  (click)="viewDetails($event, ticket)"
                  class="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                  title="View Details"
                >
                  <lucide-icon
                    [img]="EyeIcon"
                    [size]="18"
                    class="text-slate-600"
                  />
                </button>
              </div>
            </div>
            }
          </div>
          }
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    @if (selectedTicket()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      (click)="closeDetails()"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h2 class="text-xl font-bold text-slate-900 mb-2">
                {{ selectedTicket()!.subject }}
              </h2>
              <div class="flex items-center gap-3 text-xs text-slate-600">
                <span>ID: {{ selectedTicket()!.id.slice(0, 8) }}</span>
                <span>•</span>
                <span>{{ formatDate(selectedTicket()!.createdAt) }}</span>
                <span>•</span>
                <span>{{ selectedTicket()!.name }}</span>
              </div>
            </div>

            <button
              (click)="closeDetails()"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <lucide-icon
                [img]="SearchIcon"
                [size]="20"
                class="text-slate-600"
              />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Ticket Info -->
          <div>
            <h3 class="text-sm font-semibold text-slate-900 mb-4">
              Ticket Information
            </h3>
            <div
              class="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">Name</p>
                <p class="text-sm text-slate-900">
                  {{ selectedTicket()!.name }}
                </p>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">Email</p>
                <a
                  [href]="'mailto:' + selectedTicket()!.email"
                  class="text-sm text-teal-600 hover:text-teal-700"
                >
                  {{ selectedTicket()!.email }}
                </a>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">
                  Category
                </p>
                <span
                  [class]="getCategoryBadgeClass(selectedTicket()!.category)"
                  class="inline-block"
                >
                  {{ selectedTicket()!.category }}
                </span>
              </div>
              <div>
                <p class="text-xs font-semibold text-slate-600 mb-1">Status</p>
                <select
                  [(ngModel)]="selectedTicket()!.status"
                  (change)="updateStatus(selectedTicket()!)"
                  class="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Message -->
          <div>
            <h3 class="text-sm font-semibold text-slate-900 mb-2">Message</h3>
            <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p class="text-sm text-slate-700 whitespace-pre-wrap">
                {{ selectedTicket()!.message }}
              </p>
            </div>
          </div>

          <!-- Comments Section -->
          <div>
            <h3 class="text-sm font-semibold text-slate-900 mb-4">
              Admin Notes ({{ ticketComments().length }})
            </h3>

            <!-- Comments List -->
            @if (ticketComments().length > 0) {
            <div class="space-y-3 mb-4">
              @for (comment of ticketComments(); track comment.id) {
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p class="text-xs font-semibold text-slate-900">
                      {{ comment.userFirstName }} {{ comment.userLastName }}
                    </p>
                    <p class="text-xs text-slate-500">
                      {{ formatDate(comment.createdAt) }}
                    </p>
                  </div>
                  @if (comment.isAdmin) {
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700"
                  >
                    Admin
                  </span>
                  }
                </div>
                <p class="text-sm text-slate-700">{{ comment.comment }}</p>
              </div>
              }
            </div>
            }

            <!-- Add Comment Form -->
            <div class="border-t border-slate-200 pt-4">
              <textarea
                [(ngModel)]="newComment"
                placeholder="Add an internal note..."
                rows="3"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                [disabled]="isSubmittingComment()"
              ></textarea>
              <button
                (click)="submitComment()"
                [disabled]="!newComment.trim() || isSubmittingComment()"
                class="mt-3 inline-flex items-center gap-2 bg-teal-500 text-white font-medium rounded-xl px-4 py-2 text-sm hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isSubmittingComment()) {
                <div
                  class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                } @else {
                <lucide-icon [img]="SendIcon" [size]="14" />
                }
                <span>Add Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSupportComponent implements OnInit, OnDestroy {
  private supportService = inject(SupportService);
  private destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  AlertCircleIcon = AlertCircle;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  EyeIcon = Eye;
  MoreVerticalIcon = MoreVertical;
  SendIcon = Send;
  MessageSquareIcon = MessageSquare;

  // State
  allTickets = signal<SupportTicket[]>([]);
  filteredTickets = signal<SupportTicket[]>([]);
  selectedTicket = signal<SupportTicket | null>(null);
  isLoading = signal(true);

  ticketComments = signal<SupportComment[]>([]);
  newComment = '';
  isSubmittingComment = signal(false);

  // Filters
  searchQuery = '';
  filterStatus: string = 'all';

  // Stats
  stats = computed(() => {
    const tickets = this.allTickets();
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    };
  });

  ngOnInit(): void {
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    this.isLoading.set(true);
    this.supportService
      .getAllTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets) => {
          this.allTickets.set(tickets);
          this.applyFilters();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load tickets:', error);
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    let filtered = this.allTickets();

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query) ||
          t.subject.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === this.filterStatus);
    }

    this.filteredTickets.set(filtered);
  }

  selectTicket(ticket: SupportTicket): void {
    this.selectedTicket.set(ticket);
    this.newComment = '';
    this.loadComments(ticket.id);
  }

  closeDetails(): void {
    this.selectedTicket.set(null);
    this.ticketComments.set([]);
    this.newComment = '';
  }

  viewDetails(event: Event, ticket: SupportTicket): void {
    event.stopPropagation();
    this.selectTicket(ticket);
  }

  loadComments(ticketId: string): void {
    this.supportService
      .getComments(ticketId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comments) => {
          this.ticketComments.set(comments);
        },
        error: (error) => {
          console.error('Failed to load comments:', error);
        },
      });
  }

  submitComment(): void {
    if (!this.newComment.trim() || !this.selectedTicket()) return;

    this.isSubmittingComment.set(true);
    const input = {
      ticketId: this.selectedTicket()!.id,
      comment: this.newComment.trim(),
    };

    this.supportService
      .createComment(input)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.newComment = '';
          this.isSubmittingComment.set(false);
          this.loadComments(this.selectedTicket()!.id);
        },
        error: (error) => {
          console.error('Failed to add comment:', error);
          this.isSubmittingComment.set(false);
        },
      });
  }

  updateStatus(ticket: SupportTicket): void {
    this.supportService
      .updateTicketStatus(ticket.id, ticket.status as SupportStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Ticket status updated');
          this.loadTickets();
        },
        error: (error) => {
          console.error('Failed to update status:', error);
        },
      });
  }

  getStatusBadgeClass(status: SupportStatus): string {
    const base =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'open':
        return `${base} bg-blue-100 text-blue-700 border border-blue-200/50`;
      case 'in_progress':
        return `${base} bg-amber-100 text-amber-700 border border-amber-200/50`;
      case 'resolved':
        return `${base} bg-green-100 text-green-700 border border-green-200/50`;
      case 'closed':
        return `${base} bg-slate-100 text-slate-700 border border-slate-200/50`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }

  getCategoryBadgeClass(category: string): string {
    const base =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    switch (category) {
      case 'account':
        return `${base} bg-teal-100 text-teal-700 border border-teal-200/50`;
      case 'technical':
        return `${base} bg-blue-100 text-blue-700 border border-blue-200/50`;
      case 'billing':
        return `${base} bg-green-100 text-green-700 border border-green-200/50`;
      case 'other':
        return `${base} bg-slate-100 text-slate-700 border border-slate-200/50`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }

  formatStatus(status: SupportStatus): string {
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
