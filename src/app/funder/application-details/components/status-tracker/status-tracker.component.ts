// src/app/funder/components/application-detail/components/status-tracker/status-tracker.component.ts

import {
  Component,
  Input,
  signal,
  computed,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Flag,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-angular';
import {
  FundingApplication,
  ReviewNote,
} from 'src/app/SMEs/models/application.models';

interface TimelineAction {
  id: string;
  type:
    | 'approved'
    | 'rejected'
    | 'flagged'
    | 'request_info'
    | 'request_documents'
    | 'request_amendments'
    | 'internal_note'
    | 'submitted'
    | 'status_change'
    | 'peer_review'
    | 'committee_review';
  actionLabel: string;
  actor: string;
  timestamp: Date;
  message: string;
  statusChange?: {
    from: string;
    to: string;
  };
  isExpanded: boolean;
  icon: any;
  colorClass: string;
  badgeClass: string;
  isInternal: boolean;
}

@Component({
  selector: 'app-status-tracker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="status-tracker bg-white rounded-2xl border border-slate-200 p-6"
    >
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-slate-900">Action History</h3>
        <p class="text-sm text-slate-600 mt-1">
          {{ timelineActions().length }} action(s) recorded
        </p>
      </div>

      <!-- Empty State -->
      @if (timelineActions().length === 0) {
      <div class="text-center py-12">
        <div
          class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <lucide-icon
            [img]="ClockIcon"
            [size]="24"
            class="text-slate-400"
          ></lucide-icon>
        </div>
        <p class="text-slate-600">No actions recorded yet</p>
      </div>
      } @else {
      <!-- Timeline -->
      <div class="space-y-0">
        @for (action of timelineActions(); track action.id; let last = $last) {
        <!-- Timeline Entry -->
        <div class="relative flex gap-4">
          <!-- Timeline Line -->
          <div class="flex flex-col items-center">
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
              [class]="action.badgeClass"
            >
              <lucide-icon
                [img]="action.icon"
                [size]="18"
                class="text-white"
              ></lucide-icon>
            </div>

            <!-- Connector Line (not on last item) -->
            @if (!last) {
            <div class="w-0.5 h-20 bg-slate-200 mt-2"></div>
            }
          </div>

          <!-- Content -->
          <div class="flex-1 pt-1 pb-8">
            <!-- Header Row -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <!-- Action Type + Status Badge -->
                <div class="flex items-center gap-2 mb-2">
                  <h4 class="font-semibold text-slate-900">
                    {{ action.actionLabel }}
                  </h4>
                  @if (action.isInternal) {
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    Internal
                  </span>
                  }
                </div>

                <!-- Actor + Timestamp -->
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <span class="font-medium">{{ action.actor }}</span>
                  <span class="text-slate-400">•</span>
                  <time class="text-slate-500">
                    {{ formatRelativeTime(action.timestamp) }}
                  </time>
                </div>
              </div>

              <!-- Expand Toggle (if has message) -->
              @if (action.message) {
              <button
                (click)="toggleExpanded(action.id)"
                class="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-1"
                [title]="action.isExpanded ? 'Collapse' : 'Expand'"
              >
                @if (action.isExpanded) {
                <lucide-icon [img]="ChevronUpIcon" [size]="16"></lucide-icon>
                } @else {
                <lucide-icon [img]="ChevronDownIcon" [size]="16"></lucide-icon>
                }
              </button>
              }
            </div>

            <!-- Status Change Info -->
            @if (action.statusChange) {
            <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-blue-700 font-medium">Status:</span>
                  <span class="text-blue-600">
                    {{ action.statusChange.from }}
                  </span>
                </div>
                <span class="text-blue-400">→</span>
                <span class="text-blue-600 font-medium">
                  {{ action.statusChange.to }}
                </span>
              </div>
            </div>
            }

            <!-- Message (Collapsible) -->
            @if (action.message && action.isExpanded) {
            <div
              class="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <p class="text-sm text-slate-700 whitespace-pre-wrap">
                {{ action.message }}
              </p>
            </div>
            }

            <!-- Message Preview (if collapsed and has message) -->
            @if (action.message && !action.isExpanded) {
            <p
              class="mt-2 text-sm text-slate-600 line-clamp-2 cursor-pointer hover:text-slate-700"
              (click)="toggleExpanded(action.id)"
            >
              {{ action.message }}
            </p>
            }
          </div>
        </div>
        }
      </div>
      }

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-slate-200">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">
            Last updated:
            {{ lastUpdatedTime() | date : 'short' }}
          </p>
          <button
            (click)="refreshTracker()"
            class="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class StatusTrackerComponent implements OnInit {
  @Input() application: FundingApplication | null = null;

  // Icons
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircle;
  MessageSquareIcon = MessageSquare;
  FlagIcon = Flag;
  FileTextIcon = FileText;
  ClockIcon = Clock;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // State
  private expandedActions = signal<Set<string>>(new Set());
  lastUpdatedTime = signal<Date>(new Date());

  // Computed timeline
  timelineActions = computed(() => {
    const app = this.application;
    if (!app) return [];

    const actions: TimelineAction[] = [];

    console.log(
      '📊 [STATUS TRACKER] Building timeline from application:',
      app.id
    );
    console.log('📝 [STATUS TRACKER] Review notes:', app.reviewNotes);

    // Add status changes from review notes
    if (
      app.reviewNotes &&
      Array.isArray(app.reviewNotes) &&
      app.reviewNotes.length > 0
    ) {
      console.log(
        '📋 [STATUS TRACKER] Processing',
        app.reviewNotes.length,
        'review notes'
      );

      app.reviewNotes.forEach((note, index) => {
        console.log(`📝 [STATUS TRACKER] Processing note ${index}:`, note);
        const action = this.transformReviewNoteToTimelineAction(note, index);
        if (action) {
          actions.push(action);
          console.log(`✅ [STATUS TRACKER] Added action:`, action.actionLabel);
        }
      });
    } else {
      console.log('⚠️ [STATUS TRACKER] No review notes found or not an array');
    }

    // Add submission event
    if (app.submittedAt) {
      console.log('📤 [STATUS TRACKER] Adding submission event');
      actions.push({
        id: 'submitted_' + app.id,
        type: 'submitted',
        actionLabel: 'Application Submitted',
        actor: app.applicant?.firstName
          ? `${app.applicant.firstName} ${app.applicant.lastName || ''}`
          : 'Applicant',
        timestamp: app.submittedAt,
        message: 'Application submitted for review',
        isExpanded: false,
        icon: this.FileTextIcon,
        badgeClass: 'bg-slate-600',
        colorClass: 'text-slate-600',
        isInternal: false,
      });
    }

    // Sort by timestamp (newest first)
    const sorted = actions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    console.log(
      '📊 [STATUS TRACKER] Final timeline has',
      sorted.length,
      'actions'
    );
    return sorted;
  });

  ngOnInit() {
    this.updateLastModified();
  }

  // ===============================
  // TRANSFORMATIONS
  // ===============================

  private transformReviewNoteToTimelineAction(
    note: ReviewNote,
    index: number
  ): TimelineAction | null {
    if (!note || !note.type) {
      console.warn('⚠️ [TRANSFORM] Invalid note, skipping:', note);
      return null;
    }

    console.log('🔄 [TRANSFORM] Transforming note type:', note.type);

    // Map note types to UI configurations
    const typeMap: Record<string, any> = {
      internal: {
        label: 'Internal Note Added',
        icon: this.FileTextIcon,
        badge: 'bg-slate-500',
        color: 'text-slate-600',
      },
      request_info: {
        label: 'Information Requested',
        icon: this.MessageSquareIcon,
        badge: 'bg-blue-600',
        color: 'text-blue-600',
      },
      request_documents: {
        label: 'Documents Requested',
        icon: this.FileTextIcon,
        badge: 'bg-blue-600',
        color: 'text-blue-600',
      },
      request_amendments: {
        label: 'Amendments Requested',
        icon: this.MessageSquareIcon,
        badge: 'bg-amber-600',
        color: 'text-amber-600',
      },
      approve: {
        label: 'Application Approved',
        icon: this.CheckCircleIcon,
        badge: 'bg-green-600',
        color: 'text-green-600',
      },
      rejected: {
        label: 'Application Rejected',
        icon: this.XCircleIcon,
        badge: 'bg-red-600',
        color: 'text-red-600',
      },
      reject: {
        label: 'Application Rejected',
        icon: this.XCircleIcon,
        badge: 'bg-red-600',
        color: 'text-red-600',
      },
      flagged: {
        label: 'Flagged for Review',
        icon: this.FlagIcon,
        badge: 'bg-amber-600',
        color: 'text-amber-600',
      },
      flag_review: {
        label: 'Flagged for Review',
        icon: this.FlagIcon,
        badge: 'bg-amber-600',
        color: 'text-amber-600',
      },
      peer_review: {
        label: 'Peer Review Requested',
        icon: this.MessageSquareIcon,
        badge: 'bg-purple-600',
        color: 'text-purple-600',
      },
      request_peer_review: {
        label: 'Peer Review Requested',
        icon: this.MessageSquareIcon,
        badge: 'bg-purple-600',
        color: 'text-purple-600',
      },
      committee_review: {
        label: 'Referred to Committee',
        icon: this.AlertCircleIcon,
        badge: 'bg-indigo-600',
        color: 'text-indigo-600',
      },
      refer_committee: {
        label: 'Referred to Committee',
        icon: this.AlertCircleIcon,
        badge: 'bg-indigo-600',
        color: 'text-indigo-600',
      },
      add_note: {
        label: 'Internal Note Added',
        icon: this.FileTextIcon,
        badge: 'bg-slate-500',
        color: 'text-slate-600',
      },
    };

    const config = typeMap[note.type] || typeMap['internal'];

    const action: TimelineAction = {
      id: `${note.type}_${index}_${
        note.createdAt.getTime
          ? note.createdAt.getTime()
          : new Date(note.createdAt).getTime()
      }`,
      type: (note.type as any) || 'internal_note',
      actionLabel: config.label,
      actor: note.reviewerName || 'System',
      timestamp:
        note.createdAt instanceof Date
          ? note.createdAt
          : new Date(note.createdAt),
      message: note.note,
      isExpanded: false,
      icon: config.icon,
      badgeClass: config.badge,
      colorClass: config.color,
      isInternal: note.type === 'internal' || note.type === 'external',
    };

    console.log('✅ [TRANSFORM] Transformed to:', action.actionLabel);
    return action;
  }

  // ===============================
  // USER INTERACTIONS
  // ===============================

  toggleExpanded(actionId: string) {
    const expanded = new Set(this.expandedActions());
    if (expanded.has(actionId)) {
      expanded.delete(actionId);
    } else {
      expanded.add(actionId);
    }
    this.expandedActions.set(expanded);

    // Update isExpanded on actions
    const actions = this.timelineActions();
    actions.forEach((action) => {
      action.isExpanded = expanded.has(action.id);
    });
  }

  refreshTracker() {
    this.updateLastModified();
    console.log('Status tracker refreshed');
  }

  private updateLastModified() {
    this.lastUpdatedTime.set(new Date());
  }

  // ===============================
  // UTILITIES
  // ===============================

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
